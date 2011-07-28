package Packager;
use Mouse;

use uni::perl;

use Data::Dumper            ();
use Time::HiRes 	        ();
use JavaScript::Minifier    ();
use Packager::Types         ();

with 'MouseX::Getopt';

# Autoflush
BEGIN { $| = 1 }

################################################################################
# command line args
has files => (
    traits          => ['Array'],
    is              => 'rw',
    isa             => 'ArrayRef[Path::Class::File]',
    required        => 1,
    documentation   => 'files to compress',
    coerce          => 1,
    handles         => {
        all_files       => 'elements',
    },
);

has outfile => (
    is              => 'rw',
    isa             => 'Path::Class::File',
    coerce          => 1,
    required        => 1,
);

has _outdir => (
    is              => 'rw',
    isa             => 'Path::Class::Dir',
    lazy            => 1,
    default         => sub { shift->outfile->dir },
);

has minify => (
    is              => 'rw',
    isa             => 'Bool',
    default         => 0,
);


sub run {
    my $self    = shift;
    my $jscode  = '';
    
    for ($self->all_files) {
        $jscode .= '//'. $_->basename . "\n";
        $jscode .= $_->slurp;
        $jscode .= "\n\n";
    }
    
    if ($self->minify) {
        my ($mini, $fh);
        open $fh, '>', \$mini;
        JavaScript::Minifier::minify(input => $jscode, outfile => $fh);
        $jscode = $mini;
    }
    
    $self->_outdir->mkpath;
    $self->outfile->touch;
    print { $self->outfile->openw } $jscode;
}


no Mouse;
1;